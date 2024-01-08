(test.failing "continuations: base"
      (lambda (t)
        (define x 0)

        (t.is (+ 2 (call/cc (lambda (cc)
                              (set! x cc)
                              3)))
              5)

        (t.is (x 4) 6)))

(test.failing "continuations: make-range"
              (lambda (t)
                (define (make-range from to)
                  (call/cc
                   (lambda (return)
                     (let ((result '()))
                       (let ((loop (call/cc (lambda (k) k))))
                         (set! result (cons (call/cc
                                             (lambda (append)
                                               (if (< from to)
                                                   (append from)
                                                   (return (reverse result)))))
                                            result))
                         (set! from (+ from 1))
                         (loop loop))))))

                (t.is (make-range 0 10) '(0 1 2 3 4 5 6 7 8 9))
                (t.is (make-range 10 20) '(10 11 12 13 14 15 16 17 18 19))))

(test.failing "continuations: return"
      (lambda (t)
        (let ((called #f))

          (define (bar)
            (set! called #t))

          (define (foo)
            (call/cc (lambda (return)
                       (return 10)
                       (bar))))

          (t.is (foo) 10)
          (t.is called #f))))

(test.failing "continuations: calling"
      (lambda (t)
        (let ((called))
          (t.is (let ((my-val (call/cc (lambda (c) c))))
                  (if (procedure? my-val)
                      (my-val 10)
                      (begin
                        (set! called #t)
                        my-val)))
                10)
          (t.is called #t))))

;; example that found a bug in BiwaScheme
;; https://github.com/biwascheme/biwascheme/issues/257
(test.failing "continuations: saving/restoring environment"
      (lambda (t)
        (let ((result (call/cc (lambda (return)
                                 (let ((n 5)
                                       (result (list))
                                       (k #f))
                                   (set! result (append result (list (call/cc (lambda (return)
                                                                                (set! k return)
                                                                                "Hello")))))
                                   (when #t
                                     (if (zero? n)
                                         (return result))
                                     (set! n (- n 1))
                                     (k (string-append "Hello <" (number->string n) ">"))))))))

          (t.is result '("Hello <0>")))))
